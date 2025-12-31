package com.practice.expensemngr.vo;


import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;

@Data
@EqualsAndHashCode(callSuper = false)
public class TagsUpdateVO extends TagsVO implements Serializable {
    private static final long serialVersionUID = 1L;

}
