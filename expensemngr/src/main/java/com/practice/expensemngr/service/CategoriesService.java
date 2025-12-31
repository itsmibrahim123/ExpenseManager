package com.practice.expensemngr.service;

import com.practice.expensemngr.dto.CategoriesDTO;
import com.practice.expensemngr.entity.Categories;
import com.practice.expensemngr.repository.CategoriesRepository;
import com.practice.expensemngr.vo.CategoriesQueryVO;
import com.practice.expensemngr.vo.CategoriesUpdateVO;
import com.practice.expensemngr.vo.CategoriesVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.util.NoSuchElementException;

@Service
public class CategoriesService {

    @Autowired
    private CategoriesRepository categoriesRepository;

    public Long save(CategoriesVO vO) {
        Categories bean = new Categories();
        BeanUtils.copyProperties(vO, bean);
        bean = categoriesRepository.save(bean);
        return bean.getId();
    }

    public void delete(Long id) {
        categoriesRepository.deleteById(id);
    }

    public void update(Long id, CategoriesUpdateVO vO) {
        Categories bean = requireOne(id);
        BeanUtils.copyProperties(vO, bean);
        categoriesRepository.save(bean);
    }

    public CategoriesDTO getById(Long id) {
        Categories original = requireOne(id);
        return toDTO(original);
    }

    public Page<CategoriesDTO> query(CategoriesQueryVO vO) {
        org.springframework.data.jpa.domain.Specification<Categories> spec = (root, query, cb) -> {
            java.util.List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();
            if (vO.getUserId() != null) {
                predicates.add(cb.equal(root.get("userId"), vO.getUserId()));
            }
            if (vO.getType() != null) {
                predicates.add(cb.equal(root.get("type"), vO.getType()));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
        return categoriesRepository.findAll(spec, org.springframework.data.domain.Pageable.unpaged()).map(this::toDTO);
    }

    private CategoriesDTO toDTO(Categories original) {
        CategoriesDTO bean = new CategoriesDTO();
        BeanUtils.copyProperties(original, bean);
        return bean;
    }

    private Categories requireOne(Long id) {
        return categoriesRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Resource not found: " + id));
    }
}
